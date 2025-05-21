import React from "react";

const ContactPage = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-12 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold text-center text-kmu-blue mb-4">
        문의하기
      </h1>
      <p className="text-center text-gray-700 mb-6 text-sm">
        문의사항이 있으면 아래 이메일로 연락 주세요.
      </p>
      <div className="space-y-3 text-gray-700 text-base text-center">
        <div className="inline-flex items-center gap-2">
          <span className="text-lg">📧</span>
          <span>이메일: hajin0127@gmail.com</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="text-lg">📞</span>
          <span>전화: 053-000-0000</span>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
