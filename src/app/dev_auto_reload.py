import subprocess
import sys
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os

SCRIPT = 'boni.py'

class ReloadHandler(FileSystemEventHandler):
    def __init__(self, run_proc):
        self.run_proc = run_proc
    def on_modified(self, event):
        if event.src_path.endswith(SCRIPT):
            print(f'Alteração detectada em {SCRIPT}, reiniciando...')
            self.run_proc.restart()

class RunProcess:
    def __init__(self):
        self.proc = None
        self.start()
    def start(self):
        if self.proc:
            self.proc.terminate()
        self.proc = subprocess.Popen([sys.executable, SCRIPT])
    def restart(self):
        if self.proc:
            self.proc.terminate()
            self.proc.wait()
        self.start()
    def stop(self):
        if self.proc:
            self.proc.terminate()
            self.proc.wait()

if __name__ == '__main__':
    runner = RunProcess()
    event_handler = ReloadHandler(runner)
    observer = Observer()
    observer.schedule(event_handler, path=os.path.dirname(os.path.abspath(SCRIPT)) or '.', recursive=False)
    observer.start()
    print(f'Auto-reload ativado para {SCRIPT}. Salve o arquivo para reiniciar automaticamente.')
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        runner.stop()
    observer.join()
