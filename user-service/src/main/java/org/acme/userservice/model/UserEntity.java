package org.acme.userservice.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserEntity extends PanacheEntity {

    public String username;
    public String email;
    public String fullName;
    public LocalDateTime createdAt;
}
