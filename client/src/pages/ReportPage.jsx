import { useState } from 'react';

const ReportPage = () => {
  const [formData, setFormData] = useState({
    ward: '',
    issueType: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  const issueTypes = [
    "Ghost Project (Does not exist)",
    "Stalled Project",
    "Defective Construction",
    "Payroll Fraud / Ghost Workers",
    "Missing Bursary Funds",
    "Land Fraud",
    "Other Corruption"
  ];

  const wards = [
    "Kabwareng", "Terik", "Kemeloi-Maraba", "Kobujoi", "Kaptumo-Kaboi", "Koyo-Ndurio"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessData(data);
        setFormData({ ward: '', issueType: '', description: '' });
      } else {
        throw new Error(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-white p-8 rounded-xl shadow-md border-t-8 border-t-alert-green">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full text-alert-green">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold font-display text-center text-forest-900 mb-4">Evidence Secured</h2>
          <p className="text-center text-gray-700 mb-8 text-lg">
            Your report has been encrypted and submitted anonymously. We did not log your IP address or collect any personal identifiers.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mb-8">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Your Secure Tracking Code</p>
            <p className="text-3xl font-mono font-black text-amber-600 tracking-[0.2em]">{successData.trackingCode}</p>
            <p className="text-xs text-gray-500 mt-4">Save this code. It is the only way to track the status of this report later.</p>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setSuccessData(null)}
              className="text-forest-700 font-semibold hover:text-forest-900 transition-colors"
            >
              Submit another report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-display font-extrabold text-alert-red mb-4 uppercase tracking-tight">
          Report Corruption
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          You are protected. This connection is secure. We do not require an email, phone number, or login. 
          Your IP address is hidden.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-forest-100 p-6 md:p-8">
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-alert-red p-4 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-alert-red mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="ward" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Where did this happen? <span className="text-alert-red">*</span>
              </label>
              <select
                id="ward"
                required
                value={formData.ward}
                onChange={(e) => setFormData({...formData, ward: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 text-gray-900"
              >
                <option value="" disabled>Select a Ward</option>
                {wards.map(w => <option key={w} value={w}>{w} Ward</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="issueType" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                What is the issue? <span className="text-alert-red">*</span>
              </label>
              <select
                id="issueType"
                required
                value={formData.issueType}
                onChange={(e) => setFormData({...formData, issueType: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 text-gray-900"
              >
                <option value="" disabled>Categorize the corruption</option>
                {issueTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Detailed Description <span className="text-alert-red">*</span>
            </label>
            <p className="text-xs text-amber-700 mb-2 bg-amber-50 p-2 rounded">
              <strong>Caution:</strong> Do not include your own name or identifying details if you wish to remain 100% anonymous.
            </p>
            <textarea
              id="description"
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What exactly happened? Which project? Provide as much detail as possible..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Upload Photographic Evidence (MVP Placeholder)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" disabled />
                  </label>
                </div>
                <p className="text-xs text-gray-500">EXIF data will be automatically stripped. (File upload disabled in MVP phase)</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-alert-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Securing Evidence...' : 'Submit Anonymous Report'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-forest-700">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
              </svg>
              Encrypted connection • Zero log policy
            </p>
          </div>
        </form>
      </div>

    </div>
  );
};

export default ReportPage;
