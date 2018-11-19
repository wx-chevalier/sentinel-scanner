# Cendertron

> Cendertron = Crawler + cendertron

# Usage

```sh
# build image
$ docker build -t cendertron . --no-cache=true

# run as contaner
$ docker run -it --rm -p 3000:3000 --name cendertron-instance cendertron

# run as container, fix with Jessie Frazelle seccomp profile for Chrome.
$ wget https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/docker/seccomp/chrome.json -O ~/chrome.json
$ docker run -it -p 3000:3000 --security-opt seccomp=$HOME/chrome.json --name cendertron-instance cendertron
```

## Test Urls

- http://testphp.vulnweb.com/AJAX/#

# Motivation & Credits

- [gremlins.js](https://github.com/marmelab/gremlins.js/): Monkey testing library for web apps and Node.js
