document.querySelector("#googleSignIn").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(() => {
        window.location = "writeNote.html";
    }).catch(error => {
        console.log("login failed ", error);
    })
})
