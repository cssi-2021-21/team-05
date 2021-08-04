document.querySelector("#googleSignIn").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    firebase.auth().signInWithPopup(provider).then(() => {
        handleAuthClick();
    }).catch(error => {
        console.log("login failed ", error);
    })
})

function handleClientLoad() {
    gapi.load('client:auth2', () => gapi.client.init({
        apiKey: GAPI_API_KEY,
        clientId: GAPI_CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"],
        scope: "https://www.googleapis.com/auth/tasks"
    }));
}

function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();

    gapi.client.tasks.tasklists.list().then(res => {
        const taskListID = res.result.items[0].id;

        gapi.client.tasks.tasks.list({
            'tasklist': taskListID
        }).then(response => {
            console.log(response.result.items);
        });

        gapi.client.tasks.tasks.insert({
            'tasklist': taskListID,
            'resource': {
                'title': 'foobar',
                'due': "2021-08-04T00:00:00.000Z"
            }
        }).then(window.location = "writeNote.html");

    });
}

function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
}

