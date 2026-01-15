export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">TimeOff v2</h1>
                <p className="mt-2 text-slate-500">Employee Absence Management</p>
            </div>
            {children}
        </div>
    );
}
