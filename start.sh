DEMO_WEB_INDEX_FILE="/demo-web/index.html"
DEMO_WEB_INDEX_TEMP_FILE="/demo-web/index.html.bak"
EMBEDDED_JS_URL="http://xlabs-admin.uthoft.com/scripts/xLabsAnalytics.js"

sed -e 's|js/xLabsAnalytics.js|'${EMBEDDED_JS_URL}'|' ${DEMO_WEB_INDEX_FILE} > ${DEMO_WEB_INDEX_TEMP_FILE}
mv ${DEMO_WEB_INDEX_TEMP_FILE} ${DEMO_WEB_INDEX_FILE}

http-server -c-1 -p 80