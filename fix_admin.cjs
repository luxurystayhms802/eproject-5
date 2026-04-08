const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFiles(dir) {
  walkDir(dir, (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/user\?\.role === 'admin' \|\| user\?\.role === 'super_admin'/g, "user?.role === 'super_admin'");
    content = content.replace(/user\?\.role === 'super_admin' \|\| user\?\.role === 'admin'/g, "user?.role === 'super_admin'");
    content = content.replace(/request\.authUser\?\.role === 'super_admin' \|\| request\.authUser\?\.role === 'admin'/g, "request.authUser?.role === 'super_admin'");
    content = content.replace(/request\.authUser\?\.role === 'admin' \|\| request\.authUser\?\.role === 'super_admin'/g, "request.authUser?.role === 'super_admin'");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  });
}

processFiles('c:/Users/Sami/Desktop/vite/5/luxurystay-hms/client/src');
processFiles('c:/Users/Sami/Desktop/vite/5/luxurystay-hms/server/src');
