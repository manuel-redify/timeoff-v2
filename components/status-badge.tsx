import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const uppercaseStatus = status?.toUpperCase() || "NEW";

    let badgeClass = "bg-blue-500 hover:bg-blue-600";
    let label = "New";

    switch (uppercaseStatus) {
        case "APPROVED":
            badgeClass = "bg-green-500 hover:bg-green-600";
            label = "Approved";
            break;
        case "REJECTED":
            badgeClass = "bg-red-500 hover:bg-red-600";
            label = "Rejected";
            break;
        case "PENDING_REVOKE":
            badgeClass = "bg-yellow-500 hover:bg-yellow-600 text-black";
            label = "Pending Revocation";
            break;
        case "CANCELED":
            badgeClass = "bg-gray-500 hover:bg-gray-600";
            label = "Canceled";
            break;
        case "NEW":
        case "PENDING":
            badgeClass = "bg-blue-500 hover:bg-blue-600";
            label = "New";
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
