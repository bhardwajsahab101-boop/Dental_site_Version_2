import { clinicData } from "../data/clinicData";

export default function Footer({ clinic }: { clinic?: any }) {
  const clinicName = clinic?.clinicName || clinic?.name || clinicData.clinicName;
  const phone = clinic?.phone || clinicData.contact.phone;
  const email = clinic?.email || clinicData.contact.email;
  const address = clinic?.address || clinicData.contact.address;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">

        {/* Clinic Info */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">
            {clinicName}
          </h2>

          <p className="leading-relaxed text-gray-400">
            Providing trusted and modern dental care with experienced
            professionals and advanced technology.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Quick Links
          </h3>

          <ul className="space-y-3 text-sm text-gray-400">
            <li>
              <a href="/#home" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                Home
              </a>
            </li>

            <li>
              <a href="/#services" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                Services
              </a>
            </li>

            <li>
              <a href="/#doctors" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                Doctors
              </a>
            </li>

            <li>
              <a href="/#contact" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Services
          </h3>

          <ul className="space-y-3 text-gray-400">

            {clinicData.services.map((service, index) => (
              <li key={index}>
                {service.title}
              </li>
            ))}

          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Contact
          </h3>

          <div className="space-y-4 text-gray-400">
            <p>{phone}</p>

            <p>{email}</p>

            <p>{address}</p>
          </div>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-gray-500 md:flex-row">
          <p>
            © 2026 {clinicName}. All rights reserved.
          </p>

          <p className="text-center md:text-left">
            Designed with care for modern dental clinics.
          </p>
        </div>
      </div>
    </footer>
  );
}