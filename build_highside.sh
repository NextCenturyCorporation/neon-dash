# Declare variables
# =================
REMOTE_URL="https://s3.amazonaws.com/neonframework.org/neon/versions/latest/"
LOCAL_URL="bower_components/neon/"
FILE_NAME="neon-nodeps.js"
PRODUCTION_WAR_NAME="neon-gtd-1.4.0-SNAPSHOT.war"
DEVELOPMENT_WAR_NAME="neon-gtd-dev-1.4.0-SNAPSHOT.war"
CUR_DIR=$(pwd)

# Change index.html to use local version of neon-nodeps.js
# ========================================================
sed -i "s~${REMOTE_URL}${FILE_NAME}~${LOCAL_URL}${FILE_NAME}~" ./client/index.html


# Run grunt
# =========
grunt


# Download remote version of neon-nodeps.js and add it to war files
# =================================================================
mkdir -p /tmp/neon_gtd_buildscript/app/$LOCAL_URL
wget -O /tmp/neon_gtd_buildscript/app/$LOCAL_URL$FILE_NAME "$REMOTE_URL${FILE_NAME}"
cd /tmp/neon_gtd_buildscript
zip -ur "${CUR_DIR}/target/${PRODUCTION_WAR_NAME}" "."
zip -ur "${CUR_DIR}/target/${DEVELOPMENT_WAR_NAME}" "."
cd $CUR_DIR
rm -r /tmp/neon_gtd_buildscript


# Change index.html to use remote version of neon-nodeps.js
# =========================================================
sed -i "s~${LOCAL_URL}${FILE_NAME}~${REMOTE_URL}${FILE_NAME}~" ./client/index.html