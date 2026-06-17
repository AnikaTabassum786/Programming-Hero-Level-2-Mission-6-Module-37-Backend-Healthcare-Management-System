import { isValid, parse } from "date-fns";

//It safely converts a string in the format "yyyy-MM-dd" to a Date object.
//parse->Converts string to Date
//isValid->Checks if the date is correct.

export const convertToDateTime = (dateString: string | undefined) => {
    if (!dateString) return undefined;

    const date = parse(dateString, "yyyy-MM-dd", new Date());

    if (!isValid(date)) return undefined;

    return date;
}