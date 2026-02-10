import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const uppercaseStatus = status?.toUpperCase() || "NEW";

    let badgeClass = "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300";
    let label = "Pending";

    switch (uppercaseStatus) {
        case "APPROVED":
            badgeClass = "bg-green-500 hover:bg-green-600 text-white";
            label = "Approved";
            break;
        case "REJECTED":
            badgeClass = "bg-red-500 hover:bg-red-600 text-white";
            label = "Rejected";
            break;
        case "PENDING_REVOKE":
            badgeClass = "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300";
            label = "Pending Revocation";
            break;
        case "CANCELED":
            badgeClass = "bg-gray-500 hover:bg-gray-600 text-white";
            label = "Canceled";
            break;
        case "NEW":
        case "PENDING":
            badgeClass = "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300";
            label = "Pending";
            break;
    }

    // Allow overriding/appending classes
    if (className) {
        badgeClass = `${badgeClass} ${className}`;
    }

    return (
        <Badge className={badgeClass}>
            {label}
        </Badge>
    );
}
