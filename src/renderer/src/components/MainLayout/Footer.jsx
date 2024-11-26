const Footer = () => {
    const version = '1.0.0';
  
    return (
      <footer className="w-full bg-white py-3 text-center text-gray-600 text-sm border-t">
        © 2024 Powered by <a href="https://quasar-tech.in/" target="_blank">QUASAR Technologies</a>. All rights reserved. | Version: {version}
      </footer>
    );
  };
  
  export default Footer;