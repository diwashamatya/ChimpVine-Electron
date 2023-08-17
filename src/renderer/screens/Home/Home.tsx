import Footer from 'renderer/components/Footer';
import Sponsers from 'renderer/components/Sponsers';
import Search from 'renderer/components/Search';
import Grades from './Grades';
import Games from './Games';
// import Logout from 'renderer/components/Logout';
function Home() {
  return (
    <div className="mt-5 ">
      {/* <Logout /> */}
      <div className="d-flex justify-content-end">
        <Search />
      </div>
      <Grades />
      <Games />
      <Sponsers />
      <Footer />
    </div>
  );
}

export default Home;
