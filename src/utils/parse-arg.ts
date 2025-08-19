// utils/parse-arg.ts
// Utilidad para obtener argumentos tipo --arg=valor
export const parseArg = (name: string): string | undefined => {
    const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
    if (arg) {
        return arg.split("=")[1];
    }
    return undefined;
};
