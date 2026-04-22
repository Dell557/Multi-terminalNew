{
  "apps": [
    {
      "name": "wh-h5-backend",
      "script": "./server/index.js",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 8181,
        "DB_HOST": "localhost",
        "DB_PORT": 3306,
        "DB_USER": "topic_new",
        "DB_PASS": "zkyc@565758",
        "DB_NAME": "topic_new",
        "MYSQL_TABLE": "courses",
        "DB_CONNECT_TIMEOUT": 5000
      },
      "error_file": "./logs/pm2-error.log",
      "out_file": "./logs/pm2-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "restart_delay": 4000,
      "max_restarts": 10,
      "min_uptime": "5s"
    }
  ]
}
