import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import RutaProtegida from "../components/RutaProtegida";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { DashboardHome } from "../pages/dashboard/Home";
import { AccountsPage } from "../pages/dashboard/AccountsPage";
import { TransactionsPage } from "../pages/dashboard/TransactionsPage";
import { AnalyticsPage } from "../pages/dashboard/AnaliticsPage";
import { CreditPage } from "../pages/dashboard/CreditPage";
import { About } from "../pages/informacion/About";
import { ConfigPage } from "../pages/config/ConfigPage";
import { SubscriptionsPage } from "../pages/dashboard/SubscriptionsPage";

export const routerApp = createBrowserRouter([
    {
        path: "/",
        element: <LoginPage />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
    },
    {
        path: "/dashboard",
        element: <RutaProtegida proteger={<DashboardLayout />} />,
        children: [
            {
                index: true,
                element: <DashboardHome />,
            },
            {
                path: "accounts",
                element: <AccountsPage />,
            },
            {
                path: "transactions",
                element: <TransactionsPage />,
            },
            {
                path: "analytics",
                element: <AnalyticsPage />,
            },
            {
                path: "credits",
                element: <CreditPage />,
            },
            {
                path: "about",
                element: <About />,
            },
            {
                path: "configuraciones",
                element: <ConfigPage />,
            },
            {
                path: "subscriptions",
                element: <SubscriptionsPage />,
            }
        ]
    },
]);