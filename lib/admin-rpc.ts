import { Firebase } from './Firebase';
import { FirebaseAdmin } from "./firebaseAdmin";
import { CustomCors } from './custom-cors';

export class AdminRoutesRpc {
    routes() {
        const express = require("express");
        const bodyParser = require("body-parser");
        const basicAuth = require('express-basic-auth');
        const customCors = new CustomCors();
        const yaml = require('js-yaml');
        const fs = require('fs');
        const firebaseAdmin = new FirebaseAdmin();
        const firebase = new Firebase();
        const dbAdminFs = firebaseAdmin.get().firestore();
        
        let config = yaml.load(fs.readFileSync(__dirname + '/../config.yaml'));
        console.info(config);
        
        const adminApp = express();
        adminApp.use(customCors.cors());
        adminApp.use(basicAuth({
            users: { 'admin': config.secret  }
        }));

        adminApp.use(bodyParser.json());
        
        adminApp.get("/", (req, res) => {
            res.send('Nothing to see here, move along');
        });
        
        // get user
        adminApp.post("/editors-get", (req, res) => {
            let editorsCollection = dbAdminFs.collection('editors');
            let adminAuth = firebaseAdmin.get().auth();
            editorsCollection
                .get()
                .then(editors => {
                    let data = [];
                    // map instead of foreach returns array of promises
                    Promise.all(editors.docs.map(editor => {
                        return adminAuth.getUser(editor.id)
                            .then(userRef => {
                                data.push({
                                    id: editor.id,
                                    email: userRef.email,
                                    name: userRef.displayName
                                });
                            }).catch(e => {
                                console.info("no users found");
                            })
                    }))
                        .then(() => res.send(data));
                })
                .catch(e => console.error(e.stack));
        });
        
        // add user
        adminApp.post("/editors", (req, res) => {
            let email = req.body.email;
            let name = req.body.name;
            let password = req.body.password;
            if (typeof email !== 'undefined' &&
                typeof name !== 'undefined' &&
                typeof password !== 'undefined'
            ) {
                let editorRef = dbAdminFs.collection('editors').doc(); // get editor id reference
                firebaseAdmin
                    .get()
                    .auth()
                    .createUser({ // create user
                        email: email,
                        displayName: name,
                        password: password,
                    })
                    .then(userRecord => { // add user to editors collection
                        return dbAdminFs.collection('editors')
                            .doc(userRecord.uid)
                            .set({
                                editor_id: editorRef
                            })
                            .then(_ => {
                                return userRecord;
                            });
                    })
                    .then(userRecord => {
                        let firebaseAuth = firebase.get().auth();
                        console.info('sending reset and verification email to user');
                        firebaseAuth.sendPasswordResetEmail(email)
                            .then(() => {
                                console.info('email has been sent to user');
                            })
                            .catch(function (error) {
                                console.info('email hasn\'t been sent to user', error);
                            });
                        return userRecord;
                    })
                    .then(function (userRecord) { // send response to client
                        // See the UserRecord reference doc for the contents of userRecord.
                        console.info("Successfully created new user:", userRecord.uid);
                        let response = {
                            id: userRecord.uid
                        }
                        res.json(response);
                    })
                    .catch(function (error) {
                        console.info("Error creating new user:", error);
                        res.status(400);
                        res.send({ error: error.message });
                    });
            } else {
                res.status(400);
                res.send({ error: 'parameters missing' });
            }
        });
        
        // edit user
        adminApp.post("/editors-put", (req, res) => {
            let name = req.body.name;
            let userId = req.body.uid;
            if (typeof name !== 'undefined' &&
                typeof userId !== 'undefined'
            ) {
                firebaseAdmin.get().auth().updateUser(userId, {
                    displayName: name
                }).then(function (userRecord) { // send response to client
                    // See the UserRecord reference doc for the contents of userRecord.
                    console.info("Successfully updated user", userRecord.toJSON());
                    let response = {
                        id: userRecord.uid
                    }
                    res.json(response);
                }).catch(function (error) {
                    console.info("Error updating user:", error);
                    res.status(400);
                    res.send({ error: error.message });
                });
            } else {
                res.status(400);
                res.send({ error: 'parameters missing' });
            }
        });
        
        // delete user
        adminApp.post("/editors-delete", (req, res) => {
            let userId = req.query.uid;
            if (typeof userId !== 'undefined') {
                firebaseAdmin.get().auth().deleteUser(userId)
                    .then(function () {
                        dbAdminFs.collection('editors')
                            .doc(userId)
                            .delete()
                            .then(() => {
                                res.send();
                            })
                            .catch(e => console.error(e.stack));
                        console.info("Successfully deleted user");
                    })
                    .catch(function (error) {
                        console.info("Error deleting user:", error);
                        res.status(400);
                        res.send({ error: error.message });
                    });
            } else {
                res.status(400);
                res.send({ error: 'parameters missing' });
            }
        });
        
        return adminApp;

    };
}

module.exports = {
    AdminRoutesRpc
}