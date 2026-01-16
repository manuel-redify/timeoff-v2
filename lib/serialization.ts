/**
 * Serializes data for passing to Client Components.
 * Converts Decimal to number.
 * Dates are handled as Dates (Next.js supports passing Dates to Client Components in Server Actions/Components).
 */
export function serializeData<T>(data: T): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (typeof data === 'object') {
        if (Array.isArray(data)) {
            return data.map(serializeData) as unknown as T;
        }

        // Handle Decimal (duck typing)
        if (
            (data as any) !== null &&
            typeof (data as any) === 'object' &&
            typeof (data as any).toNumber === 'function' &&
            'd' in (data as any) &&
            'e' in (data as any)
        ) {
            return (data as any).toNumber() as unknown as T;
        }

        // Handle Date (Next.js Server Actions/Components usually handle Date, but sometimes it's safer to use strings if pure JSON)
        // For now, let's stick to fixing Decimal as that's the error.

        // Recursively process objects
        const newData: any = {};
        for (const key in data) {
            newData[key] = serializeData((data as any)[key]);
        }
        return newData;
    }

    return data;
}
