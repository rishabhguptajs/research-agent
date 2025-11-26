declare module 'pdfmake/build/pdfmake' {
    const pdfMake: any;
    export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
    const pdfFonts: { [file: string]: string };
    export default pdfFonts;
}
