export const guardarEnLocalStorage = (clave, valor) => {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
};

export const obtenerDeLocalStorage = (clave) => {
    try {
        const item = localStorage.getItem(clave);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error al obtener de localStorage:', error);
        return null;
    }
};

export const eliminarDeLocalStorage = (clave) => {
    try {
        localStorage.removeItem(clave);
    } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
    }
};

export const limpiarLocalStorage = () => {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error al limpiar localStorage:', error);
    }
};
