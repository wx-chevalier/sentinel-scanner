# Cendertron

> Cendertron = Crawler + rendertron

# Usage

```sh
# build image
$ docker build -t cendertron . --no-cache=true

$ docker run -it -p 8080:8080 --name cendertron-instance cendertron

$ wget https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/docker/seccomp/chrome.json -O ~/chrome.json
$ docker run -it -p 8080:8080 --security-opt seccomp=$HOME/chrome.json --name cendertron-instance cendertron
```

# Motivation & Credits

- [gremlins.js](https://github.com/marmelab/gremlins.js/): Monkey testing library for web apps and Node.js
