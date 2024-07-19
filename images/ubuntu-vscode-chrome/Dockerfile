FROM ubuntu:latest

# Install necessary packages
RUN apt-get update && \
    apt-get install -y wget curl git gnupg unzip openjdk-11-jre-headless xvfb chromium-browser && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install Selenium Server and ChromeDriver
RUN wget -O /tmp/selenium-server-standalone.jar https://selenium-release.storage.googleapis.com/3.141/selenium-server-standalone-3.141.59.jar && \
    wget -O /tmp/chromedriver.zip https://chromedriver.storage.googleapis.com/2.41/chromedriver_linux64.zip && \
    unzip /tmp/chromedriver.zip -d /usr/local/bin/ && \
    rm /tmp/chromedriver.zip && \
    chmod +x /usr/local/bin/chromedriver

# Expose ports
EXPOSE 8080 4444

# Start code-server and Selenium server
CMD ["sh", "-c", "code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry & xvfb-run -a java -jar /tmp/selenium-server-standalone.jar -port 4444"]
