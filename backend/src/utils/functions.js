export function getElementById(param){
    return document.getElementById(param)
};

export function hasNumberORSymbol(param) {
    const regexValidator = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/;
    
    return regexValidator.test(param);
}