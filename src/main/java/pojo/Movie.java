package pojo;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.Date;

@XmlRootElement
public class Movie {
    @XmlElement(name = "Poster")
    private String poster;

    @XmlElement(name = "Title")
    private String title;

    @XmlElement(name = "Type")
    private String trpe;

    @XmlElement(name = "Year")
    private Date year;

    @XmlElement(name = "imdbID")
    private String imdbID;


    public String getPoster() {
        return poster;
    }

    public void setPoster(String poster) {
        this.poster = poster;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTrpe() {
        return trpe;
    }

    public void setTrpe(String trpe) {
        this.trpe = trpe;
    }

    public Date getYear() {
        return year;
    }

    public void setYear(Date year) {
        this.year = year;
    }

    public String getImdbID() {
        return imdbID;
    }

    public void setImdbID(String imdbID) {
        this.imdbID = imdbID;
    }

    @Override
    public String toString() {
        return "pojo.Movie{" +
                "poster='" + poster + '\'' +
                ", title='" + title + '\'' +
                ", trpe='" + trpe + '\'' +
                ", year=" + year +
                ", imdbID='" + imdbID + '\'' +
                '}';
    }

    public Movie() {
    }

    public Movie(String poster, String title, String trpe, Date year, String imdbID) {
        this.poster = poster;
        this.title = title;
        this.trpe = trpe;
        this.year = year;
        this.imdbID = imdbID;
    }


}
