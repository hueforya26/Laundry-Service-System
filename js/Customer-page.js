const jsCustomerBtn = document.querySelector('.jsCustomerBtn');

jsCustomerBtn.addEventListener('click', () => {
    const containerModal = document.querySelector('.containerModal');
    const shadowModal = document.querySelector('.containerModalShadow');
    shadowModal.classList.remove('offShadow');
    containerModal.classList.remove('offContainer');
    

});
const closeBtn = document.querySelector('.closeBtn');

closeBtn.addEventListener('click', () => {
    const containerModal = document.querySelector('.containerModal');
    containerModal.classList.add('offContainer');
    const shadowModal = document.querySelector('.containerModalShadow');
    shadowModal.classList.add('offShadow');
 });