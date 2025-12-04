export const formatearMoneda = (valor) => {

    const numero = Number(valor);

    if(isNaN(numero) || !isFinite(numero)) {
        return '0.00';
    }


    const formateado = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    
    return formateado.format(numero);

}