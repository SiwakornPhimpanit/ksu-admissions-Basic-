export interface SourceLinks {
  fees: string;
  calendar: string;
  calendarIndex: string;
  programs: string;
}

export const sources: SourceLinks = {
  fees: "https://student-admis.ksu.ac.th/portal/programs/branches/65",
  calendar: "https://re.ksu.ac.th/?page=135414",
  calendarIndex: "https://edi.ksu.ac.th/page/academic-calendar",
  programs: "https://student-admis.ksu.ac.th/portal/programs",
};

export type ProgramId = "bachelor4" | "transfer3" | "transfer2" | "diploma2";

export interface Program {
  id: ProgramId;
  title: string;
  years: number;
  qualification: string;
  icon: string;
}

export const programs: Program[] = [
  {
    id: "bachelor4",
    title: "ปริญญาตรี 4 ปี",
    years: 4,
    qualification: "ม.6 / ปวช. หรือเทียบเท่า",
    icon: "◈",
  },
  {
    id: "transfer3",
    title: "ปริญญาตรี เทียบโอน 3 ปี",
    years: 3,
    qualification: "ตรวจสอบวุฒิและรายวิชาเทียบโอนกับคณะ",
    icon: "↗",
  },
  {
    id: "transfer2",
    title: "ปริญญาตรี เทียบโอน 2 ปี",
    years: 2,
    qualification: "ปวส. สาขาที่เกี่ยวข้อง ตามเกณฑ์หลักสูตร",
    icon: "⇄",
  },
  {
    id: "diploma2",
    title: "ประกาศนียบัตรวิชาชีพชั้นสูง 2 ปี",
    years: 2,
    qualification: "ม.6 / ปวช. ตามประกาศรับสมัคร",
    icon: "◇",
  },
];

export const feeYears: readonly number[] = [2565, 2566, 2567, 2568, 2569];

export const feeReference = 10200;

export const officialFeesPdf =
  "https://websiteadmin.ksu.ac.th/FILES_UPLOADS/infoksuacth/website_20260115103310_687092558.pdf";

export const calendarPdfs: Record<number, string> = {
  2569:
    "https://websiteadmin.ksu.ac.th/FILES_UPLOADS/reksuacth/" +
    encodeURIComponent("รวม ปวส ปตรี บัณฑิต.pdf"),
  2568:
    "https://websiteadmin.ksu.ac.th/FILES_UPLOADS/reksuacth/" +
    encodeURIComponent("1.ปฏิทิน 2-68 ปรับ รองรับทหาร2มีค69 ลงนามแล้ว.pdf"),
};

export interface FeeDetail {
  name: string;
  semester: number;
}

export const feeDetails: FeeDetail[] = [
  {
    name: "วิศวกรรมเครื่องกล / วิศวกรรมโลจิสติกส์ / วิศวกรรมคอมพิวเตอร์ / วิศวกรรมอุตสาหการ / วิศวกรรมเมคคาทรอนิกส์ / วิศวกรรมมไฟฟ้า",
    semester: 10200,
  },
  { name: "วิศวกรรมเครื่องจักรกลเกษตร", semester: 8700 },
  { name: "เทคโนโลยีคอมพิวเตอร์", semester: 5700 },
];

