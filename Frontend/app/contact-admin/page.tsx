import Link from "next/link";

export default function ContactAdmin() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎧</div>

          <h1 className="text-2xl font-bold text-gray-800">
            Need help accessing your account?
          </h1>

          <p className="text-gray-500 mt-2">
            Password resets are handled by the university administrator.
            Please contact ISMS for assistance.
          </p>
        </div>

        {/* Contact Card */}
        <div className="border rounded-2xl overflow-hidden mb-8">

          <div className="p-5 border-b">
            <p className="font-semibold text-gray-700">
              Kathmandu University
            </p>
            <p className="text-gray-500">
              Block 03, Central Campus
            </p>
            <p className="text-gray-500">
              Dhulikhel, Nepal
            </p>
          </div>

          <div className="p-5 border-b flex justify-between">
            <span>Phone</span>
            <span>+977-11-415100</span>
          </div>

          <div className="p-5 border-b flex justify-between">
            <span>Extension</span>
            <span>4100</span>
          </div>

          <div className="p-5 flex justify-between">
            <span>Email</span>
            <span>isms@ku.edu.np</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-4">

          <a
            href="mailto:isms@ku.edu.np"
            className="block text-center bg-linear-to-r from-purple-600 to-blue-500 text-white py-4 rounded-xl font-semibold hover:opacity-90"
          >
            Contact Admin
          </a>

          <Link
            href="/"
            className="block text-center border py-4 rounded-xl text-purple-600 font-semibold hover:bg-gray-50"
          >
            ← Back to Login
          </Link>

        </div>

      </div>
    </div>
  );
}