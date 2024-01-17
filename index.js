if(!parseInt(process.env.PORT)){
    throw new Error(`Invalid HTTP port ${process.env.PORT} in variable \`PORT\``);
}
if(!process.env.PASSWORD || process.env.PASSWORD.length < 8){
    throw new Error("Needs a password of length 8 or more in the variable `PASSWORD`")
}
if(!process.env.FILE_TREE_PATH){
    throw new Error("Requires directory tree path in variable `FILE_TREE_PATH`")
}

const webdav = require('webdav-server').v2;

// User manager (tells who are the users)
const userManager = new webdav.SimpleUserManager();
const user = userManager.addUser('root', process.env.PASSWORD, false);

// Privilege manager (tells which users can access which files/folders)
const privilegeManager = new webdav.SimplePathPrivilegeManager();
privilegeManager.setRights(user, '/', [ 'all' ]);

const server = new webdav.WebDAVServer({
    // HTTP Digest authentication with the realm 'Default realm'
    httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, 'Default realm'),
    privilegeManager: privilegeManager,
    port: parseInt(process.env.PORT), // Load the server on the port 2000 (if not specified, default is 1900)
    autoSave: { // Will automatically save the changes in the 'data.json' file
        treeFilePath: process.env.FILE_TREE_PATH
    }
});

new Promise(res => {
    server.autoLoad((e) => {
        if(e){ // Couldn't load the 'data.json' (file is not accessible or it has invalid content)
            console.error("Could not load data.json file content")
            server.rootFileSystem().addSubTree(server.createExternalContext(), {})
        }
        res();
    })
}).then(() => {
    server.start(() => console.log(`Server running on port ${process.env.PORT}`))
})