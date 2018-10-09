#!/bin/bash
# Usage : ./scanio.sh <save file>
# Example: ./scanio.sh cname_list.txt

# Premium
function ech() {
  spinner=( "|" "/" "-" "\\" )
  while true; do
    for i in ${spinner[@]}; do
      echo -ne "\r[$i] $1"
      sleep 0.15
    done
  done
}

# Joining elements together
function join_by() {
  local IFS=$1
  shift
  echo "$*"
}

# Kill function
function die() {
  disown $1
  kill -9 $1
  
  length=$(echo -n $3 | wc -m)
  Count=$(($length + 5))
  Clear=$(head -c $Count < /dev/zero | tr '\0' '\040')
  echo -ne "\r $Clear"
  echo -e "\r[*] $2"
}

function run() {
  ech "$1" &
  pid=$!
  eval "$2"
  die $pid "$3" "$1"
}

# Gathering data from scans.io
#
# Instructions for if you already have a file downloaded:
# 1. Comment or delete the next four lines.
# 2. Comment out the line below with the downloaded .gz file
#file=$(echo "insertfilehere.gz")
latest=$(curl -s "https://opendata.rapid7.com/sonar.fdns_v2/" | grep "<td><a" | tail -1 | cut -d'"' -f2)
file=$(echo $latest | cut -d'/' -f3)
cmd="wget -q https://opendata.rapid7.com$latest"
run "Downloading $file (This may take a while)." "$cmd" "Finished Downloading $file"

# Parsing it into a file called cname_scanio
msg="Grepping for CNAME records."
ech $msg &
pid=$!
zcat $file | grep 'type":"cname' | awk -F'":"' '{print 3,5}' | \
  awk -F'"' '{print 1,3}' | sed -e s/" type "/" "/g >> cname_scanio
die $pid "CNAME records grepped." $msg

# List of CNAMEs we're going to grep for
declare -a arr=(
  "\.cloudfront.net"
  "\.s3-website"
  "\.s3.amazonaws.com"
  "w.amazonaws.com"
  "1.amazonaws.com"
  "2.amazonaws.com"
  "s3-external"
  "s3-accelerate.amazonaws.com"
  "\.herokuapp.com"
  "\.herokudns.com"
  "\.wordpress.com"
  "\.pantheonsite.io"
  "domains.tumblr.com"
  "\.zendesk.com"
  "\.github.io"
  "\.global.fastly.net"
  "\.helpjuice.com"
  "\.helpscoutdocs.com"
  "\.ghost.io"
  "cargocollective.com"
  "redirect.feedpress.me"
  "\.myshopify.com"
  "\.statuspage.io"
  "\.uservoice.com"
  "\.surge.sh"
  "\.bitbucket.io"
  "custom.intercom.help"
  "proxy.webflow.com"
  "landing.subscribepage.com"
  "endpoint.mykajabi.com"
  "\.teamwork.com"
  "\.thinkific.com"
  "clientaccess.tave.com"
  "wishpond.com"
  "\.aftership.com"
  "ideas.aha.io"
  "domains.tictail.com"
  "cname.mendix.net"
  "\.bcvp0rtal.com"
  "\.brightcovegallery.com"
  "\.gallery.video"
  "\.bigcartel.com"
  "\.activehosted.com"
  "\.createsend.com"
  "\.acquia-test.co"
  "\.proposify.biz"
  "simplebooklet.com"
  "\.gr8.com"
  "\.vendecommerce.com"
  "\.azurewebsites.net"
  "\.cloudapp.net"
  "\.trafficmanager.net"
  "\.blob.core.windows.net"
)

# Prepare CNAME grep
DOMAINS=$(join_by '|' ${arr[@]})

# Grepping CNAMEs from the array
cmd="grep -Ei '${DOMAINS}' cname_scanio >> cname_db"
run "Sorting CNAME records." "$cmd" "CNAME records sorted."

# Sorting the CNAME list
cmd="cat cname_db | cut -d' ' -f1 | sort | uniq >> $1"
run "Cleaning up." "$cmd" "Cleaned up."

# RM files.
rm cname_db cname_scanio
echo "[+] Finished."