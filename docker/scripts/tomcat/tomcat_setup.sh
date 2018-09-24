#!/bin/bash

if [ -f /.tomcat_admin_created ]; then
    echo "Tomcat 'admin' user already created"
    exit 0
fi

#define tomcat root installation
CATALINA_HOME='/usr/local/tomcat'

#generate password
TOMCAT_PASS='password'
PASS=${TOMCAT_PASS:-$(pwgen -s 12 1)}
_word=$( [ ${TOMCAT_PASS} ] && echo "preset" || echo "random" )

echo "=> Creating and admin user with a ${_word} password in Tomcat"
sed -i -r 's/<\/tomcat-users>//' ${CATALINA_HOME}/conf/tomcat-users.xml
echo '<role rolename="manager-gui"/>' >> ${CATALINA_HOME}/conf/tomcat-users.xml
echo '<role rolename="manager-script"/>' >> ${CATALINA_HOME}/conf/tomcat-users.xml
echo '<role rolename="manager-jmx"/>' >> ${CATALINA_HOME}/conf/tomcat-users.xml
echo '<role rolename="admin-gui"/>' >> ${CATALINA_HOME}/conf/tomcat-users.xml
echo '<role rolename="admin-script"/>' >> ${CATALINA_HOME}/conf/tomcat-users.xml
echo "<user username=\"admin\" password=\"${PASS}\" roles=\"manager-gui,manager-script,manager-jmx,admin-gui, admin-script\"/>" >> ${CATALINA_HOME}/conf/tomcat-users.xml
echo '</tomcat-users>' >> ${CATALINA_HOME}/conf/tomcat-users.xml 
echo "=> Done!"
touch /.tomcat_admin_created

echo "========================================================================"
echo "You can now configure to this Tomcat server using:"
echo ""
echo "    admin:${PASS}"
echo ""
echo "========================================================================"

echo "=> Removing IP restrictions for host-manager and manager"
sed -i '/<Valve className="org.apache.catalina.valves.RemoteAddrValve/d' ${CATALINA_HOME}/webapps/host-manager/META-INF/context.xml
sed -i '/allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1/d' ${CATALINA_HOME}/webapps/host-manager/META-INF/context.xml
sed -i '/<Valve className="org.apache.catalina.valves.RemoteAddrValve/d' ${CATALINA_HOME}/webapps/manager/META-INF/context.xml
sed -i '/allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1/d' ${CATALINA_HOME}/webapps/manager/META-INF/context.xml


