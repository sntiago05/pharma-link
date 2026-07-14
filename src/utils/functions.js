export function getElementById(param){
    return document.getElementById(param)
};

export function hasNumberORSymbol(param) {
    const regexValidator = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/;
    
    return regexValidator.test(param);
};

export function validateEmail(param) {
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;

    return regexEmail.test(param);
};
