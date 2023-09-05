use std::collections::BTreeMap;

use rand::{rngs::ThreadRng, Rng};
use serde::Serialize;

#[derive(Clone, Copy, Debug, Serialize)]
pub struct Sudoku {
    pub puzzle: &'static str,
    pub solution: &'static str,
    pub difficulty: Difficulty,
}

const SEEDS: [Sudoku; 40] = [
    Sudoku {
        puzzle: "g--d--caf---g----ii-f--hg-bb-iaedhgc--afcg--d-g-b-----f-d--abc---b------c--h-bfia",
        solution:
            "gbhdiecafacegbfdhiidfcahgebbfiaedhgcehafcgibddgcbhiafefidegabchhabifcedgceghdbfia",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "bf-hiac-g-gi------a-hf-g---g-a-fi--ddef---i-b--b-a-g-ff---gbh--hac---------e-cfd-",
        solution:
            "bfdhiacegegicbdafhachfegdbighabfiecddefgchiabcibdaeghffdeagbhichacidfbgeibgehcfda",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "hgad-e--b-cbf-ge---df-aih-----i-------d-ecai-g---fa----igadf----fe-i-----h-eg-fd-",
        solution:
            "hgadceifbicbfhgeadedfbaihcgcahibdgeffbdgecaihgeihfadbcbigadfchedfecihbgaahcegbfdi",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "-fbe-c----e-----a---g-ihb--gb-fhdc-eid-g-eahbch-----f-----ef-ga-g----e-i--hi-----",
        solution:
            "afbegcidhheidfbgacdcgaihbefgbafhdcieidfgceahbchebaidfgbidcefhgafgchdaebieahibgfcd",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "c--d-fgeb---g--i-hg-ih--da-a-g-b-cde-edc--a--b--------i-e-cd-ha-fb-h-e-ch--e-----",
        solution:
            "cahdifgebedfgabichgbihecdafahgfbicdefedcghabibicadehfgigebcdfhadfbihaegchcaefgbid",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "bi---ec--eg--h-fbdf--------i-hba-dfe----ehbig--bf-d-h--f-e-a-c-----g-e--cde--f--a",
        solution:
            "bidgfecahegcahifbdfhadcbgeiichbagdfedafcehbiggebfidahchfgedaicbabihgcedfcdeibfhga",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "-----ef-ha--bf--ecfe-gc---a----gbch--a--df-b--bi----f-h-af-gidbdf----g--i--c--ha-",
        solution:
            "bicdaefghahgbfidecfedgchbiaedfagbchicahidfebggbiehcafdhcafegidbdfbhiagceigecbdhaf",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "--fg--hec-ebc-------h-dfgabb--h-a-fg-g-df-i--f-a---b--hf----ad---if----hc-ea---bi",
        solution:
            "dafgbihecgebcahdifichedfgabbidhcaefgegcdfbihafhaigebcdhfgbicadeabifedcghcdeahgfbi",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "-----b-f-e-aih----bi----a----e---i---g-bf--a-----cihg-ic-fdhg-a--h---f-cgef-iad-b",
        solution:
            "dhcgabefiefaihcbdgbigdefachcaehgdibfhgibfecadfbdacihgeicbfdhgeaadhebgficgefciadhb",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "e--f-b-------eid-f--h----b-ge-c-fadhab-ihgfe-hc--d----d-g---cf---eg--h-bf---i----",
        solution:
            "edcfgbihabgaheidcfifhdcaebggeicbfadhabdihgfechcfadebgidigbahcfecaegfdhibfhbeicgad",
        difficulty: Difficulty::Easy,
    },
    Sudoku {
        puzzle: "g-hedcf---i-f--a--e--a-----c--i-deh-i-------g--g--e---a----f--c-cf-e-gi-b-------e",
        solution:
            "gahedcfbidicfbgaehefbaihcgdcbaigdehfihebfadcgfdghceiabaeighfbdchcfdebgiabgdcaihfe",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "-di--ac---b-cid-h---h--b-d-----f----h-d----fca---c-i--d----i-e-bh---cd-g-g---fac-",
        solution:
            "fdighacbeebgcidfhacahfebgdigecifhbadhidabgefcafbdceighdcabgihefbhfeacdigigehdfacb",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "--ac-i------ah-d---e----i---a-e-bc----g--f--ad---gae--ig-fa------hd-e-g-c-d-b----",
        solution:
            "hdaceigfbbifahgdcegecbfdiahfaiedbchgehgicfbdadcbhgaeifigefachbdabhdiefgccfdgbhaei",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "fg----i---h--f-e--e-bd--afh-f--hg--ic------b----f-c-----c-------eiac-gdf-b-----e-",
        solution:
            "fgaebhicdihdcfaegbecbdgiafhdfebhgcaicahidefbgbigfacdhegdchefbiaheiacbgdfabfgidhec",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "--d-g-fi---e-ci-d-a----eg-----i---f---bg--ec-e--d--haig----f----ha--------ch-g-e-",
        solution:
            "cbdaghfiehgefciadbaifbdeghcdahiecbfgifbghaecdecgdfbhaigeicafdbhbhaeidcgffdchbgiea",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "----d-a---a-ie---di------h-d-e--cg-b-b-e--i----c-i--dh--h-gf--c------b-g--i-ce-a-",
        solution:
            "ehfcdgabicabiehfgdigdfbachediehacgfbhbgefdicaafcgibedhbehagfdicfcadhibeggdibcehaf",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "---cfa-ibf---i-------g---f--i--h-cd-gdf--------cd--fb-------bc--gb---dhi---he--g-",
        solution:
            "dhecfagibfbgeidhaccaigbhefdbiafhecdggdfbaciehhecdgifbaafhidgbceegbacfdhiicdhebagf",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "a------g-b--di-a-f--e--ahi----a------bae--------ichbaei---de------c-igd-d-h----ci",
        solution:
            "aidhefcgbbhgdicaeffcebgahidheiabgdfccbaefdihggdfichbaeiacgdefbhefbchigdadghfabeci",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "----g-------ci--bg-i-de-af-------beh-----fgdi---eb-f----ah--ig---hg-d---cd--a----",
        solution:
            "hacfgbdieefdciahbggibdehafcagfidcbehbceahfgdidhiebgfcafbahceigdiehgfdcabcdgbaiehf",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "gfbc---dh-a-------d--a--fi--daifc--ech------f-------c-f---e--b---d-----i--igh-d--",
        solution:
            "gfbcieadhiahbdfcegdceaghfibbdaifcghechgebdiafeifhagbcdfgcdeihbahbdfcaegiaeighbdfc",
        difficulty: Difficulty::Medium,
    },
    Sudoku {
        puzzle: "-e-fh--a-g----ed---a--b-f---ih----dc--------a----g----b---i---dhc-gf-----g------e",
        solution:
            "debfhciagghfiaedcbcaidbgfehaihbefgdcfbgcdiehaedchgabifbfaeihcgdhcegfdabiigdacbhfe",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "----i-b---fc--a-h-eb----i-fcieg--ad---hd-e----d--a----f---b-e-i-------b--h--e----",
        solution:
            "hageifbcdifcbdagheebdchgiafciegfbadhaghdcefibbdfiahcegfcahbdegideifgchbaghbaeidfc",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "-------hg-----h-d-a-g---ei--ce--dg--dbf---------bfid--hg---f----d--h---c--a-eg---",
        solution:
            "bedfiachgficeghbdaahgdbceificehadgfbdbfgceiahgahbfidcehgbcdfaeiediahbfgccfaieghbd",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "h---f------------i--e---a-h-dhe---a---fh-b----i--c---gf-ga-di--a-i---d-bce------a",
        solution:
            "hgcifabdedabgehfciifebdcaghbdheigcafgcfhabeideiadcfhbgfbgahdiecahicgedfbcedfbigha",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "f----dha----b------a------dic---h------c--egb-----------a-----ed--f-ec-g-fg------",
        solution:
            "febigdhachdcbfageigaiehcbfdicegbhadfahfcdiegbbgdaefichcbadigfhedihfaecbgefghcbdia",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "c-a---i---b--c--ede----g--c-e---dga--c---b--i--gf-----b-----ei------a-cg--ie----a",
        solution:
            "cfahdeigbgbhacifedeidbfgahchebcidgafacfgebhdiidgfahcbebacdgfeihfheibadcgdgiehcbfa",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "--a-i---cc-g-------h--e--a--a---ib---d--f--h-----------i---d-f------g-c-dg---b--h",
        solution:
            "beagifhdccfghdaibeihdbecfaghafcgibedgdbafechiecidbhagfaihecdgfbfbeihgdcadgcfabeih",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "i--f--ec------a-fbg-b-i---h-d---ihg-----b---fe---a------d-----i---ie-b-------g---",
        solution:
            "iahfdbecgdcehgaifbgfbeicdahbdacfihgechgdbeaifeifgahcbdhbdacfgeifgciedbhaaeibhgfdc",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "--e---c------i--g-------d-hbaf--------cfhe--ie------f-h-d-c-----f-h----c---i-ga--",
        solution:
            "fdegbhciaacheidfgbibgcfadehbafdgihcedgcfhebaiehibacgfdhidacfebggfahebidccebidgahf",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "--f-d-i---g--b-a-d--c-a-----c-i---e---eh--g---------ac---------b---i-e----gf--d--",
        solution:
            "abfcdhigehgiebfacddecgaibhfgcdifahebfaehcbgdiihbdegfacefabgdcihbdhaicefgcigfhedba",
        difficulty: Difficulty::Hard,
    },
    Sudoku {
        puzzle: "-ica------------bh----g--f--g---a---i-e----c-a---f------d--bg------c---e-fg----id",
        solution:
            "ficabhdeggeaidfcbhdhbegcifabgfceahdiidebhgacfachdfiegbeadfibghchbigcdfaecfghaebid",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "-h-i------i---------f--bh--b---a--ed-ca------i--f---h--------c----he--f-ab--df---",
        solution:
            "ehbicdgafdigafhcbecafegbhdibghcaifedfcadheigbiedfbgahchfebiadcggdihecbfaabcgdfeih",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "-h--c-f-ice-------b--ia--------g-h------e---ff--h---i----b---eh----------ga--f--c",
        solution:
            "ahgdcefbiceigfbahdbfdiahcgediefgchabgbhaeidcffachbdeigicfbdagehedbchgifahgaeifbdc",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "a----db---g-c----f--e-f--i---------i----h-f-d--g---ch---b--e-c-ca------h-d-------",
        solution:
            "afchidbegigdcebhafhbegfadicfehdgcabibcaehifgddigbafcheghbfdeicacafibgedhediachgfb",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "------c--g-b--a---------g-h---e----gb--id-----i-f---eb----i---c-he-f-d--a------h-",
        solution:
            "edhbgicfagfbchaeidicadefgbhhafebcidgbegidhacfdicfaghebfgdhiebaccheafbdgiabigcdfhe",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "---bf-i-------hc-aa----------g------h--c-e----i----bh----f---g--f-----e---hig-a--",
        solution:
            "chebfaidgfgdeihcbaabidcgefhbeghdifachafcbegiddicgafbheicafedhgbgfbahcdeiedhigbacf",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "--c-----d---g-i--h-i----b--ace------d--bh----b--f---------e---------bea--d--a--c-",
        solution:
            "gecabhifdfbagdicehhidefcbgaaceigdhbfdgfbheaicbhifcagdeiagcefdhbcfhdibeagedbhagfci",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "-----d-h--h-----a-gb------i-----a--g----eh-c--i--d-----ge---a--d----f-----ab--i--",
        solution:
            "iacefdghbehdgibcafgbfhacedicehfbadigfdgiehbcaaibcdgfehbgedhiafcdciagfhbehfabceigd",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "-bi-------c----e---------af---eba-----a-i-g------c--i----h-e--d-e------gc-b--f---",
        solution:
            "fbiaegdhcachdfbegiedgchibafgicebafdhbhafidgcedfegchaibiafhgecbdhedbacifgcgbidfhea",
        difficulty: Difficulty::Expert,
    },
    Sudoku {
        puzzle: "---i--h-bc----b----g----a----gd-----e--h-f------b---ac-c------ha-----id--i--gd---",
        solution:
            "deficahgbchagfbdeibgiedhacffagdicbheebchafgididhbegfacgcdabiefhafbcheidghiefgdcba",
        difficulty: Difficulty::Expert,
    },
];

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Difficulty {
    Easy,
    Medium,
    Hard,
    Expert,
}

pub fn get_seed(difficulty: Difficulty, rng: &mut ThreadRng) -> Sudoku {
    let offset = match difficulty {
        Difficulty::Easy => 0,
        Difficulty::Medium => 10,
        Difficulty::Hard => 20,
        Difficulty::Expert => 30,
    };
    let index = rng.gen_range(0..10);

    SEEDS[offset + index]
}

pub type Layout = [[i8; 9]; 9];

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum Token {
    A,
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I,
}

fn char_to_token(c: char) -> Option<Token> {
    match c {
        'a' => Some(Token::A),
        'b' => Some(Token::B),
        'c' => Some(Token::C),
        'd' => Some(Token::D),
        'e' => Some(Token::E),
        'f' => Some(Token::F),
        'g' => Some(Token::G),
        'h' => Some(Token::H),
        'i' => Some(Token::I),
        _ => None,
    }
}

pub fn get_base_layout() -> Layout {
    [
        [0, 1, 2, 3, 4, 5, 6, 7, 8],
        [9, 10, 11, 12, 13, 14, 15, 16, 17],
        [18, 19, 20, 21, 22, 23, 24, 25, 26],
        [27, 28, 29, 30, 31, 32, 33, 34, 35],
        [36, 37, 38, 39, 40, 41, 42, 43, 44],
        [45, 46, 47, 48, 49, 50, 51, 52, 53],
        [54, 55, 56, 57, 58, 59, 60, 61, 62],
        [63, 64, 65, 66, 67, 68, 69, 70, 71],
        [72, 73, 74, 75, 76, 77, 78, 79, 80],
    ]
}

pub type TokenMap = BTreeMap<Token, char>;

pub fn get_token_map(rng: &mut ThreadRng) -> TokenMap {
    let tokens = &mut [
        Token::A,
        Token::B,
        Token::C,
        Token::D,
        Token::E,
        Token::F,
        Token::G,
        Token::H,
        Token::I,
    ];
    tokens.sort_by(|_, _| rng.gen::<i8>().cmp(&0));

    let mut token_map = BTreeMap::new();
    for (index, token) in tokens.iter().enumerate() {
        token_map.insert(*token, (index + 1).to_string().chars().next().unwrap());
    }

    token_map
}

pub fn replace_tokens(sequence: &'static str, token_map: &TokenMap) -> Vec<char> {
    sequence
        .chars()
        .map(|c| match char_to_token(c) {
            Some(tok) => token_map[&tok],
            None => '-',
        })
        .collect()
}

pub fn collect_row(iter: impl Iterator<Item = i8>) -> [i8; 9] {
    let mut row = [0; 9];
    for (index, item) in iter.enumerate() {
        row[index] = item;
    }
    row
}

pub fn collect_rows(iter: impl Iterator<Item = [i8; 9]>) -> [[i8; 9]; 9] {
    let mut rows = [[0; 9]; 9];
    for (index, item) in iter.enumerate() {
        rows[index] = item;
    }
    rows
}

pub fn rotate_layout_90(layout: &Layout) -> Layout {
    let iter = layout[0].iter().enumerate().map(|(index, _row)| {
        let iter = layout.iter().map(|row| row[index]).rev();
        collect_row(iter)
    });
    collect_rows(iter)
}

pub fn rotate_layout_180(layout: &Layout) -> Layout {
    let iter = layout
        .iter()
        .rev()
        .map(|row| collect_row(row.iter().rev().copied()));
    collect_rows(iter)
}

pub fn rotate_layout_270(layout: &Layout) -> Layout {
    let iter = layout[0]
        .iter()
        .enumerate()
        .map(|(index, _row)| collect_row(layout.iter().map(|row| row[index])))
        .rev();

    collect_rows(iter)
}

pub fn rotate_layout(layout: &Layout, rng: &mut ThreadRng) -> Layout {
    match rng.gen_range(0..4) {
        0 => layout.clone(),
        1 => rotate_layout_90(layout),
        2 => rotate_layout_180(layout),
        3 => rotate_layout_270(layout),
        _ => panic!("Invalid rotation"),
    }
}

pub fn get_layout_bands(layout: &Layout) -> [[[i8; 9]; 3]; 3] {
    [
        [layout[0], layout[1], layout[2]],
        [layout[3], layout[4], layout[5]],
        [layout[6], layout[7], layout[8]],
    ]
}

pub fn shuffle_layout_rows(layout: &Layout, rng: &mut ThreadRng) -> Layout {
    let mut bands = get_layout_bands(layout);
    bands.sort_by(|_, _| rng.gen::<i8>().cmp(&0));

    collect_rows(bands.iter().flatten().cloned())
}

pub fn shuffle_layout_columns(layout: &Layout, rng: &mut ThreadRng) -> Layout {
    rotate_layout_270(&shuffle_layout_rows(&rotate_layout_90(layout), rng))
}

pub fn shuffle_layout_bands(layout: &Layout, rng: &mut ThreadRng) -> Layout {
    let mut bands = get_layout_bands(layout);
    bands
        .iter_mut()
        .for_each(|band| band.sort_by(|_, _| rng.gen::<i8>().cmp(&0)));

    let iter = bands
        .iter()
        .flat_map(|band| band.iter().map(|row| collect_row(row.iter().copied())));

    collect_rows(iter)
}

pub fn shuffle_layout_stacks(layout: &Layout, rng: &mut ThreadRng) -> Layout {
    rotate_layout_270(&shuffle_layout_bands(&rotate_layout_90(layout), rng))
}

pub fn shuffle_layout(layout: &Layout, rng: &mut ThreadRng) -> Layout {
    shuffle_layout_columns(
        &shuffle_layout_rows(
            &shuffle_layout_stacks(&shuffle_layout_bands(layout, rng), rng),
            rng,
        ),
        rng,
    )
}

pub fn get_layout(base_layout: &Layout, rng: &mut ThreadRng) -> Layout {
    shuffle_layout(&rotate_layout(base_layout, rng), rng)
}

pub fn populate_layout(layout: &Layout, sequence: Vec<char>) -> Vec<Vec<char>> {
    layout
        .iter()
        .map(|row| row.iter().map(|cell| sequence[*cell as usize]).collect())
        .collect()
}

type Board = Vec<Vec<char>>;

pub fn board_to_sequence(board: Board) -> String {
    let mut sequence = String::new();

    for row in board.iter() {
        for cell in row.iter() {
            sequence.push_str(&cell.to_string());
        }
    }

    sequence.to_string()
}

pub fn get_sequence(layout: &Layout, seed_sequence: &'static str, token_map: &TokenMap) -> String {
    board_to_sequence(populate_layout(
        layout,
        replace_tokens(seed_sequence, token_map),
    ))
}

pub fn generate(difficulty: Difficulty) -> Sudoku {
    let mut rng = rand::thread_rng();
    let seed = get_seed(difficulty, &mut rng);
    let layout = &get_layout(&get_base_layout(), &mut rng);
    let token_map = &get_token_map(&mut rng);
    let puzzle = Box::leak(Box::new(get_sequence(layout, seed.puzzle, token_map)));
    let solution = Box::leak(Box::new(get_sequence(layout, seed.solution, token_map)));
    Sudoku {
        puzzle,
        solution,
        difficulty,
    }
}

// #[cfg(test)]
// mod tests {
//     use crate::sudokugen::{generate, Difficulty};
//
//     extern crate test;
//
//     use test::Bencher;
//
//     #[test]
//     fn test_print_sudoku() {
//         let sudoku = generate(Difficulty::Medium);
//         let mut s = String::new();
//         for row in 0..9 {
//             for col in 0..9 {
//                 let idx = row * 9 + col;
//                 s.push_str(&sudoku.solution[idx..idx + 1].to_string());
//                 s.push(' ')
//             }
//             s.push('\n');
//         }
//         println!("{}", s);
//     }
//
//     // v1: 13,397ns
//     // v2: 8,900ns
//     // v3: 7,750ns
//     // v4: 7,150ns
//     // v4: 7,000ns
//     #[bench]
//     fn test_get_sudoku(b: &mut Bencher) {
//         b.iter(|| generate(Difficulty::Medium));
//     }
// }
