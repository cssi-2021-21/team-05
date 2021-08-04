document.querySelector("#googleSignIn").addEventListener("click", async function(){
    const googleAuth = gapi.auth2.getAuthInstance();
    const googleUser = await googleAuth.signIn();
    const token = googleUser.getAuthResponse().id_token;
    const access = googleUser.getAuthResponse().access_token;
    const credential = firebase.auth.GoogleAuthProvider.credential(token, access);
    firebase.auth().signInWithCredential(credential).then(() => {
        window.location = "writeNote.html"
    });
})

function handleClientLoad() {
    gapi.load('client:auth2', () => gapi.client.init({
        apiKey: GAPI_API_KEY,
        clientId: GAPI_CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"],
        scope: "https://www.googleapis.com/auth/tasks"
    }));
}
