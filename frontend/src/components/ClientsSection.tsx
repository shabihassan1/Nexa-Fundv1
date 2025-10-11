import { Separator } from "@/components/ui/separator";

const ClientsSection = () => {
  const clients = [
    {
      name: "Microsoft",
      logo: "https://img.icons8.com/color/96/microsoft.png"
    },
    {
      name: "Google",
      logo: "https://img.icons8.com/color/96/google-logo.png"
    },
    {
      name: "Apple",
      logo: "https://img.icons8.com/ios-filled/96/mac-os.png"
    },
    {
      name: "Amazon",
      logo: "https://img.icons8.com/color/96/amazon.png"
    },
    {
      name: "Meta",
      logo: "https://img.icons8.com/color/96/meta.png"
    },
    {
      name: "Netflix",
      logo: "https://img.icons8.com/color/96/netflix.png"
    },
    {
      name: "Tesla",
      logo: "https://img.icons8.com/color/96/tesla.png"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Clients</h2>
          <p className="text-gray-600">We have been working with some Fortune 500+ clients</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center justify-items-center">
          {clients.map((client, index) => (
            <div key={index} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-200 p-3">
              <img 
                src={client.logo} 
                alt={`${client.name} logo`}
                className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-200"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-medium text-gray-600">${client.name}</span>`;
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
