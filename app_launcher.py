import webview
import subprocess
import time
import os
import sys
import urllib.request

# 로컬 서버 설정
PORT = 3000
URL = f"http://localhost:{PORT}"

def is_server_running():
    try:
        req = urllib.request.Request(f"{URL}/api/health", headers={"User-Agent": "AI-OOTD-Launcher"})
        with urllib.request.urlopen(req, timeout=0.5) as response:
            return response.status == 200
    except Exception:
        return False

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def start_backend_server():
    base_dir = get_base_dir()
    server_script = os.path.join(base_dir, "dist", "server.cjs")
    if not os.path.exists(server_script):
        server_script = os.path.join(base_dir, "server.ts")
    
    # 윈도우에서 콘솔 창(CMD) 없이 백그라운드로 실행
    creationflags = 0x08000000 if sys.platform == "win32" else 0
    cmd = ["node", server_script]
    try:
        return subprocess.Popen(cmd, cwd=base_dir, creationflags=creationflags, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        print(f"서버 시작 오류: {e}")
        return None

class Api:
    """
    JavaScript(React)에서 pywebview.api를 통해 호출할 수 있는 브리지.
    COM 개체 순환 참조 방지를 위해 window 객체를 인스턴스 멤버로 직접 저장하지 않음.
    """
    def closeWindow(self):
        try:
            if webview.windows:
                webview.windows[0].destroy()
        except Exception:
            pass

    def minimizeWindow(self):
        try:
            if webview.windows:
                webview.windows[0].minimize()
        except Exception:
            pass

    def toggleFullscreen(self):
        try:
            if webview.windows:
                webview.windows[0].toggle_fullscreen()
        except Exception:
            pass

    def resizeWindow(self, width, height):
        try:
            if webview.windows:
                webview.windows[0].resize(width, height)
        except Exception:
            pass

def main():
    backend_proc = None

    # 1. 서버가 꺼져 있으면 바로 실행
    if not is_server_running():
        backend_proc = start_backend_server()
        # 서버 준비 확인 (0.05초 간격으로 최대 3초 대기, server.cjs 기준 대개 0.2초 내 응답)
        for _ in range(60):
            if is_server_running():
                break
            time.sleep(0.05)

    # 2. window 객체 생성 및 실행 (index.html 내의 스플래시 스피너가 즉시 회전하며 로딩)
    api = Api()
    webview.create_window(
        title="AI OOTD Stylist",
        url=URL,
        width=1280,
        height=850,
        resizable=True,
        frameless=True,  # OS 기본 타이틀 바 완전 삭제
        easy_drag=False,
        js_api=api
    )

    try:
        webview.start(gui="edgechromium", debug=False)
    finally:
        # 프로그램 창 종료 시 백엔드 Node 서버도 함께 종료
        if backend_proc:
            try:
                backend_proc.terminate()
            except Exception:
                pass

if __name__ == "__main__":
    main()
