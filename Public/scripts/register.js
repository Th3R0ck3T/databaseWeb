function SendRegisterInfo() {
    const errorMessageElement = document.getElementById('register-error');


    fetch('/register', {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
            user: {
                username: formData.get('user[username]'),
                password: formData.get('user[password]'),
                confirmPassword: formData.get('user[confirmPassword]')
            }
        })
    }).then(response => response.json()).then(data => {
        if (data.error) {
            errorMessageElement.textContent = data.error || '';
            switch (data.error) {
                case 'Hesla se neshodují':
                    document.getElementById('reg_password').value = '';
                    document.getElementById('reg_confirmPassword').value = '';
                    break;
                case 'Uživatelské jméno již existuje':
                    document.getElementById('reg_username').value = '';
                    document.getElementById('reg_password').value = '';
                    document.getElementById('reg_confirmPassword').value = '';
                    break;
            }

        } else {
            window.location.href = '/?success=Registrace úspěšná';
        }

    }).catch(error => {
        console.error('Chyba:', error);
        errorMessageElement.textContent = 'Došlo k chybě při odesílání formuláře.';
    });
}