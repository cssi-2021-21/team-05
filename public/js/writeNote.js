let googleUser = null;

window.onload = () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            googleUser = user;
            console.log(googleUser);
            document.querySelector("#helloTitle").innerHTML = `Hello, ${googleUser.displayName ? googleUser.displayName : googleUser.email.split('@')[0]}!`
        } else {
            document.querySelector(".hero").innerHTML = "You are not logged in.";
        }
    });
}

document.querySelector("#logoutButton").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
        window.location = "index.html";
    }).catch((error) => {
        alert(error);
    });
})

document.querySelector("#createNoteButton").addEventListener("click", () => {
    const payload = {
        title: document.querySelector("#noteTitle").value,
        text: document.querySelector("#noteText").value,
        created: new Date().getTime()
    }
    firebase.database().ref(`/users/${googleUser.uid}`).push(payload).then(() => {
        alert("Note Submitted.");
        document.querySelector("#noteTitle").value = "";
        document.querySelector("#noteText").value = "";
    }).catch(error => {
        console.log("error writing new note: ", error);
    })
});
