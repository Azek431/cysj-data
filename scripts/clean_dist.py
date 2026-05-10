from pathlib import Path
import os
import shutil
import stat

p = Path('docs/.vitepress/dist')
if not p.exists():
    print('no dist')
    raise SystemExit

print('removing', p)

def onerror(func, path, exc_info):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception as e:
        print('onerror failed', path, e)
        raise

shutil.rmtree(p, onerror=onerror)
print('removed dist')
