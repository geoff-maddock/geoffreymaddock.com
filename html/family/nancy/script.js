// script.js

document.addEventListener('DOMContentLoaded', function () {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function () {
            modal.style.display = 'block';
            modalImg.src = this.src;
        });
    });
});

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}