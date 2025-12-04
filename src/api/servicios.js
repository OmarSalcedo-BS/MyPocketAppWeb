const API_URL = "http://localhost:3001/";

export const endpoints = {
    users: API_URL + "users",
    accounts: API_URL + "accounts",
    transactions: API_URL + "transactions",
};

const httpGet = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const httpPost = async (url, data) => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const httpPut = async (url, data) => {
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const httpDelete = async (url) => {
    const response = await fetch(url, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

export const api = {
    login: async (email, password) => {
        try {
            const users = await httpGet(`${endpoints.users}?email=${email}&password=${password}`);
            if (users.length > 0) {
                return { success: true, user: users[0] };
            } else {
                return { success: false, message: 'Credenciales incorrectas' };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: 'Error del servidor' };
        }
    },

    register: async (userData) => {
        try {
            const existingUsers = await httpGet(`${endpoints.users}?email=${userData.email}`);

            if (existingUsers.length > 0) {
                return { success: false, message: 'El correo ya está registrado' };
            }

            const newUser = await httpPost(endpoints.users, userData);
            return { success: true, user: newUser };
        } catch (error) {
            return { success: false, message: error.message || 'Error de red general. Intenta de nuevo.' };
        }
    },

    getUsers: async () => {
        try {
            return await httpGet(endpoints.users);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    },

    getUserById: async (id) => {
        try {
            return await httpGet(`${endpoints.users}/${id}`);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            throw error;
        }
    },

    createUser: async (user) => {
        try {
            return await httpPost(endpoints.users, user);
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    },

    getAllAccounts: async () => {
        try {
            return await httpGet(endpoints.accounts);
        } catch (error) {
            console.error('Error al obtener las cuentas:', error);
            throw error;
        }
    },

    getAccountById: async (id) => {
        try {
            return await httpGet(`${endpoints.accounts}/${id}`);
        } catch (error) {
            console.error('Error al obtener la cuenta:', error);
            throw error;
        }
    },

    createAccount: async (accountData) => {
        try {
            return await httpPost(endpoints.accounts, accountData);
        } catch (error) {
            console.error('Error al crear la cuenta:', error);
            throw error;
        }
    },

    updateAccount: async (id, accountData) => {
        try {
            return await httpPut(`${endpoints.accounts}/${id}`, accountData);
        } catch (error) {
            console.error('Error al actualizar la cuenta:', error);
            throw error;
        }
    },

    deleteAccount: async (id) => {
        try {
            return await httpDelete(`${endpoints.accounts}/${id}`);
        } catch (error) {
            console.error('Error al eliminar la cuenta:', error);
            throw error;
        }
    },

    getAllTransactions: async () => {
        try {
            return await httpGet(endpoints.transactions);
        } catch (error) {
            console.error('Error al obtener las transacciones:', error);
            throw error;
        }
    },

    getTransactionById: async (id) => {
        try {
            return await httpGet(`${endpoints.transactions}/${id}`);
        } catch (error) {
            console.error('Error al obtener la transacción:', error);
            throw error;
        }
    },

    createTransaction: async (transactionData) => {
        try {
            return await httpPost(endpoints.transactions, transactionData);
        } catch (error) {
            console.error('Error al crear la transacción:', error);
            throw error;
        }
    },

    updateTransaction: async (id, transactionData) => {
        try {
            return await httpPut(`${endpoints.transactions}/${id}`, transactionData);
        } catch (error) {
            console.error('Error al actualizar la transacción:', error);
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        try {
            return await httpDelete(`${endpoints.transactions}/${id}`);
        } catch (error) {
            console.error('Error al eliminar la transacción:', error);
            throw error;
        }
    },
};