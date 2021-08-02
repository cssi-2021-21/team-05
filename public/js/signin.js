
document.querySelector("#googleSignIn").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(() => {
        window.location = "writeNote.html";
    }).catch(error => {
        console.log("login failed ", error);
    })
})

document.querySelector("#emailSignIn").addEventListener("click", () => {
    document.querySelector(".modal").classList.add("is-active");
})

document.querySelector(".modal-background").addEventListener("click", () => {
    document.querySelector(".modal").classList.remove("is-active");
})

{
    let buttonAction = () => {
        const email = document.querySelector("#emailInput").value;
        const password = document.querySelector("#passwordInput").value;
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location = "writeNote.html";
            })
            .catch((error) => {
                alert(error);
            });
    }

    function listenerFunction() {
        buttonAction();
    }

    document.querySelector("#loginButton").addEventListener("click", listenerFunction);

    document.querySelector(".has-text-grey").addEventListener("click", () => {
        const confirmPass = document.querySelector("#passwordConfirmInput");
        confirmPass.classList.remove("is-hidden");
        document.querySelector(".has-text-grey").classList.add("is-hidden");
        document.querySelector("#loginButton").innerHTML = "Create New Account";
        buttonAction = () => {
            const email = document.querySelector("#emailInput").value;
            const password = document.querySelector("#passwordInput").value;
            const password2 = confirmPass.value;
            console.log(password2);
            console.log(password);
            if (password2 == password) {
                firebase.auth().createUserWithEmailAndPassword(email, password)
                    .then(() => {
                        window.location = "writeNote.html";
                    })
                    .catch((error) => {
                        alert(error);
                    });
            } else {
                alert("Your passwords don't match.");
            }
        };
    })
}