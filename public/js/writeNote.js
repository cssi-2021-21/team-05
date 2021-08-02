let googleUser = null;

window.onload = () => {
    console.log('hello');
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
});

/*
document.querySelector("#createNoteButton").addEventListener("click", () => {
    const payload = {
        title: document.querySelector("#noteTitle").value,
        text: document.querySelector("#noteText").value,
        due: selectedDate.toString(),
        created: new Date(Date.now()).toString()
    }
    firebase.database().ref(`/users/${googleUser.uid}`).push(payload).then(() => {
        alert("Note Submitted.");
        document.querySelector("#noteTitle").value = "";
        document.querySelector("#noteText").value = "";
    }).catch(error => {
        console.log("error writing new note: ", error);
    })
});*/

{
    function toggleInputCard(){
        document.querySelector("#inputCard").classList.toggle("is-hidden");
        document.querySelector("#inputCardToggle").classList.toggle("is-hidden");
    }

    document.querySelector("#inputCardToggle").addEventListener("click", () => toggleInputCard());
    document.querySelector("#cancelButton").addEventListener("click", () => toggleInputCard());
}


