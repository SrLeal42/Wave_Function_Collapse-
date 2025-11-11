// O WFC passará as afinidades neste formato numérico
export type AffinitiesNumeric = {
    [tileId: string]: { [neighborId: string]: number }
};