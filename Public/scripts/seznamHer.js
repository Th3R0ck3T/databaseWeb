function showNotification(message) {
    const notificationDiv = document.createElement('div');
    notificationDiv.classList.add('notification');
    notificationDiv.innerText = message;
    document.body.appendChild(notificationDiv);

    // Schová vyskakovací okno po 5 sekundách
    setTimeout(() => {
        notificationDiv.style.display = 'none';
        document.body.removeChild(notificationDiv);
    }, 5000);
    
}