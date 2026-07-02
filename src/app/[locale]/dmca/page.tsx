'use client';
export const runtime = 'edge';

import { useParams } from 'next/navigation';
import Link from 'next/link';

const content = {
  en: {
    title: 'DMCA Policy',
    lastUpdated: 'Last updated: July 3, 2025',
    intro:
      'Nemoclaw respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe content on our platform infringes your copyright, please follow the procedures below.',
    s1Title: 'Copyright Policy',
    s1Body:
      'We take copyright infringement seriously. Upon receiving a valid DMCA takedown notice, we will expeditiously remove or disable access to the allegedly infringing content and notify the content provider. Repeat infringers may have their accounts terminated.',
    s2Title: 'How to Submit a DMCA Takedown Notice',
    s2Body:
      'To submit a DMCA takedown notice, please send an email to dmca@nemoclaw.com with the following information required by 17 U.S.C. § 512(c)(3):',
    s2Items: [
      'A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.',
      'A description of the copyrighted work you claim has been infringed.',
      'The URL or specific location on our platform where the allegedly infringing material is located.',
      'Your contact information, including your address, telephone number, and email address.',
      'A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.',
      'A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.',
    ],
    s2Footer: 'Send your notice to: dmca@nemoclaw.com',
    s3Title: 'Counter-Notice',
    s3Body:
      'If you believe your content was removed by mistake or misidentification, you may submit a counter-notice to dmca@nemoclaw.com. A valid counter-notice must include: your physical or electronic signature; identification of the material removed and its prior location; a statement under penalty of perjury that you have a good faith belief the material was removed as a result of mistake or misidentification; your name, address, and telephone number; and a statement consenting to the jurisdiction of your local federal court. Upon receiving a valid counter-notice, we will forward it to the original complainant and may restore the removed content after 10–14 business days unless the complainant files a court action.',
    contact: 'For all DMCA-related inquiries, contact us at: dmca@nemoclaw.com',
  },
  zh: {
    title: 'DMCA版权保护政策',
    lastUpdated: '最后更新：2025年7月3日',
    intro:
      'Nemoclaw 尊重知识产权，遵守《数字千年版权法》(DMCA)。如果您认为本平台上的内容侵犯了您的版权，请按照以下流程提交投诉。',
    s1Title: '版权政策',
    s1Body:
      '我们对版权侵权问题高度重视。收到有效的 DMCA 下架通知后，我们将迅速删除或禁止访问涉嫌侵权的内容，并通知内容提供方。多次侵权者的账户可能被终止。',
    s2Title: '如何提交 DMCA 下架通知',
    s2Body:
      '如需提交 DMCA 下架通知，请发送电子邮件至 dmca@nemoclaw.com，并提供以下由 17 U.S.C. § 512(c)(3) 规定的法定要素：',
    s2Items: [
      '版权所有者或其授权代理人的物理签名或电子签名。',
      '对您声称被侵权的受版权保护作品的描述。',
      '涉嫌侵权材料在本平台上的 URL 或具体位置。',
      '版权所有者的联系信息，包括地址、电话号码和电子邮件地址。',
      '善意声明：您真诚地认为，以被投诉方式使用该材料未经版权所有者、其代理人或法律授权。',
      '准确性声明：通知中的信息是准确的，且在伪证处罚下声明您有权代表版权所有者行事。',
    ],
    s2Footer: '请将通知发送至：dmca@nemoclaw.com',
    s3Title: '反通知',
    s3Body:
      '如果您认为您的内容因错误或误认而被删除，可以向 dmca@nemoclaw.com 提交反通知。有效的反通知须包括：您的物理或电子签名；被删除材料的描述及其之前的位置；在伪证处罚下声明您真诚地认为材料是因错误或误认而被删除；您的姓名、地址和电话号码；以及同意您所在地联邦法院管辖权的声明。收到有效反通知后，我们将把它转发给原始投诉方，并可能在 10–14 个工作日后恢复被删除的内容，除非投诉方提起诉讼。',
    contact: '如有任何 DMCA 相关问题，请联系：dmca@nemoclaw.com',
  },
};

export default function DmcaPage() {
  const params = useParams();
  const locale = (params?.locale as string) === 'zh' ? 'zh' : 'en';
  const c = content[locale];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href={`/${locale}`} className="text-orange-400 hover:text-orange-300 text-sm mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="text-4xl font-bold mb-2">{c.title}</h1>
        <p className="text-gray-500 text-sm mb-12">{c.lastUpdated}</p>
        <p className="text-gray-300 mb-10 leading-relaxed">{c.intro}</p>

        <div className="space-y-8">
          {/* Section 1: Copyright Policy */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">{c.s1Title}</h2>
            <p className="text-gray-400 leading-relaxed">{c.s1Body}</p>
          </div>

          {/* Section 2: How to Submit */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">{c.s2Title}</h2>
            <p className="text-gray-400 leading-relaxed mb-4">{c.s2Body}</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400 leading-relaxed mb-4">
              {c.s2Items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
            <p className="text-gray-400">
              {c.s2Footer.split('dmca@nemoclaw.com')[0]}
              <a href="mailto:dmca@nemoclaw.com" className="text-orange-400 hover:text-orange-300">
                dmca@nemoclaw.com
              </a>
            </p>
          </div>

          {/* Section 3: Counter-Notice */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">{c.s3Title}</h2>
            <p className="text-gray-400 leading-relaxed">{c.s3Body}</p>
          </div>
        </div>

        {/* Footer contact */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-gray-500 text-sm">
          {c.contact.split('dmca@nemoclaw.com')[0]}
          <a href="mailto:dmca@nemoclaw.com" className="text-orange-400 hover:text-orange-300">
            dmca@nemoclaw.com
          </a>
        </div>
      </div>
    </div>
  );
}
