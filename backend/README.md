# TradeInsight_backend


在服务器上安装python环境
在服务器上安装baostock
pip install baostock -i https://pypi.org/simple

sudo lsof -i :8080
sudo kill -9 PID
nohup java -jar tradeinsight-backend-0.0.1-SNAPSHOT.jar > trade.log 2>&1 &


在服务器上安装akshare来获取行情
pip install aktools  --break-system-packages
win：pip install aktools --user
启动指令：python -m aktools --port 8888 

linux 
# 1. 创建虚拟环境
python3 -m venv ~/ak_env

# 2. 激活虚拟环境
source ~/ak_env/bin/activate

# 3. 安装 AKTools
pip install aktools akshare

# 4. 运行
nohup  python3 -m aktools --port 8888 > aktools.log 2>&1 &
nohup  proxychains  python3 -m aktools --port 8888 > aktools.log 2>&1 &

redis-server.exe redis.windows.conf