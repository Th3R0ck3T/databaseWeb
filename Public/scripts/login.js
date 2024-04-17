function SendLoginInfo() {
    const errorMessageElement = document.getElementById('login-error');

    fetch('/login', {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
            "username": formData.get('user[username]'),
            "password": formData.get('user[password]')
        })
    }).then(response => response.json()).then(data => {
        console.log("hlavni stranka");
        if (data.error) {
            errorMessageElement.textContent = data.error || '';
            document.getElementById("login_username").value = ''
            document.getElementById("login_password").value = ''
        } else {
            window.location.href = '/?success=Přihlášení úspěšné';
        }

    }).catch(error => {
        console.error('Chyba:', error);
        errorMessageElement.textContent = 'Došlo k chybě při odesílání formuláře.';
    });
    
}