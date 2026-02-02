"""
Gunicorn configuration for production
"""
import multiprocessing
import os

# Server socket
bind = os.environ.get('GUNICORN_BIND', '127.0.0.1:8000')
backlog = 2048

# Worker processes
# Formula: (2 x CPU cores) + 1
workers = int(os.environ.get('GUNICORN_WORKERS', (2 * multiprocessing.cpu_count()) + 1))
worker_class = 'sync'
worker_connections = 1000
max_requests = 1000  # Restart workers after N requests to prevent memory leaks
max_requests_jitter = 100  # Randomize restarts
timeout = 30
keepalive = 2

# Process naming
proc_name = 'workorder_backend'

# Logging
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process management
daemon = False  # Let systemd manage
pidfile = '/var/run/gunicorn/gunicorn.pid'
user = os.environ.get('GUNICORN_USER', 'www-data')
group = os.environ.get('GUNICORN_GROUP', 'www-data')
umask = 007

# Server hooks
def post_fork(server, worker):
    server.log.info(f'Worker spawned (pid: {worker.pid})')

def pre_exec(server):
    server.log.info('Forked child, re-executing.')

def when_ready(server):
    server.log.info('Server is ready. Spawning workers')

def worker_int(worker):
    worker.log.info(f'Worker received INT or QUIT signal (pid: {worker.pid})')

def on_exit(server):
    server.log.info('Server is stopping')
